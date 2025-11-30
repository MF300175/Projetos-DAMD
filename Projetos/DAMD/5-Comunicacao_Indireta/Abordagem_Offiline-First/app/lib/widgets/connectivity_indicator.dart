import 'dart:async';
import 'package:flutter/material.dart';
import '../services/connectivity_service.dart';
import '../services/sync_service.dart';
import '../services/database_service.dart';

class ConnectivityIndicator extends StatefulWidget {
  const ConnectivityIndicator({super.key});

  @override
  State<ConnectivityIndicator> createState() => _ConnectivityIndicatorState();
}

class _ConnectivityIndicatorState extends State<ConnectivityIndicator> {
  ConnectivityStatus _status = ConnectivityStatus.offline;
  StreamSubscription<ConnectivityStatus>? _subscription;
  bool _isRefreshing = false;

  @override
  void initState() {
    super.initState();
    _status = ConnectivityService.instance.currentStatus;
    _subscription = ConnectivityService.instance.statusStream.listen(
      (status) {
        if (mounted) {
          setState(() {
            _status = status;
          });
        }
      },
    );
  }

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }

  Future<void> _forceSync() async {
    if (_isRefreshing || !ConnectivityService.instance.isOnline) {
      return;
    }

    setState(() {
      _isRefreshing = true;
    });

    try {
      await SyncService.instance.forceSync();
      
      final pendingOps = await DatabaseService.instance.getPendingSyncOperations();
      ConnectivityService.instance.updateStatusWithPending(pendingOps.isNotEmpty);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(pendingOps.isEmpty 
              ? 'Sincronização concluída' 
              : '${pendingOps.length} operação(ões) pendente(s)'),
            duration: const Duration(seconds: 2),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erro ao sincronizar: $e'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 2),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isRefreshing = false;
        });
      }
    }
  }

  Color _getStatusColor() {
    switch (_status) {
      case ConnectivityStatus.online:
        return Colors.green;
      case ConnectivityStatus.onlineWithPending:
        return Colors.orange;
      case ConnectivityStatus.offline:
        return Colors.red;
    }
  }

  IconData _getStatusIcon() {
    switch (_status) {
      case ConnectivityStatus.online:
        return Icons.cloud_done;
      case ConnectivityStatus.onlineWithPending:
        return Icons.cloud_sync;
      case ConnectivityStatus.offline:
        return Icons.cloud_off;
    }
  }

  String _getStatusText() {
    switch (_status) {
      case ConnectivityStatus.online:
        return 'Online';
      case ConnectivityStatus.onlineWithPending:
        return 'Sincronizando...';
      case ConnectivityStatus.offline:
        return 'Offline';
    }
  }

  @override
  Widget build(BuildContext context) {
    final canSync = ConnectivityService.instance.isOnline && !_isRefreshing;
    
    return InkWell(
      onTap: canSync ? _forceSync : null,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: _getStatusColor().withOpacity(0.1),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: _getStatusColor(),
            width: 1.5,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (_isRefreshing)
              SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(_getStatusColor()),
                ),
              )
            else
              Icon(
                _getStatusIcon(),
                size: 16,
                color: _getStatusColor(),
              ),
            const SizedBox(width: 6),
            Text(
              _getStatusText(),
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: _getStatusColor(),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

